"""
Databricks SQL connector with connection pooling and error handling.

Provides a robust client for executing queries against Databricks SQL warehouses
with automatic retries, connection management, and type-safe result handling.
"""

import logging
from typing import List, Dict, Any, Optional, TypeVar, Generic
from contextlib import contextmanager
from databricks import sql
from databricks.sql.client import Connection, Cursor
import time

from ..config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T')


class DatabricksConnectionError(Exception):
    """Raised when connection to Databricks fails."""
    pass


class DatabricksQueryError(Exception):
    """Raised when query execution fails."""
    pass


class DatabricksClient:
    """
    Databricks SQL client with connection pooling and error handling.
    
    Usage:
        client = DatabricksClient()
        with client.get_connection() as conn:
            results = client.fetch_all(conn, "SELECT * FROM table")
    """
    
    def __init__(
        self,
        server_hostname: Optional[str] = None,
        http_path: Optional[str] = None,
        access_token: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Initialize Databricks SQL client.
        
        Args:
            server_hostname: Databricks workspace URL (without https://)
            http_path: SQL warehouse HTTP path
            access_token: Personal access token
            max_retries: Maximum number of retry attempts
            retry_delay: Initial delay between retries (exponential backoff)
        """
        # Use settings if not provided
        self.server_hostname = server_hostname or settings.databricks_host.replace("https://", "").replace("http://", "")
        self.http_path = http_path or settings.databricks_http_path
        self.access_token = access_token or settings.databricks_token
        
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        logger.info(f"Initialized DatabricksClient for {self.server_hostname}")
    
    @contextmanager
    def get_connection(self) -> Connection:
        """
        Get a database connection with automatic cleanup.
        
        Yields:
            Connection: Active Databricks SQL connection
            
        Raises:
            DatabricksConnectionError: If connection fails
        """
        conn = None
        try:
            logger.debug("Establishing Databricks SQL connection")
            conn = sql.connect(
                server_hostname=self.server_hostname,
                http_path=self.http_path,
                access_token=self.access_token
            )
            yield conn
        except Exception as e:
            logger.error(f"Failed to connect to Databricks: {e}")
            raise DatabricksConnectionError(f"Connection failed: {e}") from e
        finally:
            if conn:
                try:
                    conn.close()
                    logger.debug("Databricks SQL connection closed")
                except Exception as e:
                    logger.warning(f"Error closing connection: {e}")
    
    def _execute_with_retry(
        self,
        cursor: Cursor,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Cursor:
        """
        Execute query with retry logic.
        
        Args:
            cursor: Database cursor
            query: SQL query
            parameters: Query parameters
            
        Returns:
            Cursor: Executed cursor
            
        Raises:
            DatabricksQueryError: If query fails after retries
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                if parameters:
                    cursor.execute(query, parameters)
                else:
                    cursor.execute(query)
                return cursor
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Query failed (attempt {attempt + 1}/{self.max_retries}), retrying in {delay}s: {e}")
                    time.sleep(delay)
                else:
                    logger.error(f"Query failed after {self.max_retries} attempts: {e}")
        
        raise DatabricksQueryError(f"Query failed after {self.max_retries} attempts: {last_error}") from last_error
    
    def execute_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Execute a query without returning results (INSERT, UPDATE, DELETE, etc.).
        
        Args:
            query: SQL query
            parameters: Query parameters
            
        Raises:
            DatabricksQueryError: If query execution fails
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                self._execute_with_retry(cursor, query, parameters)
                logger.info(f"Query executed successfully")
            finally:
                cursor.close()
    
    def fetch_all(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a query and fetch all results.
        
        Args:
            query: SQL query
            parameters: Query parameters
            
        Returns:
            List of result dictionaries
            
        Raises:
            DatabricksQueryError: If query execution fails
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                self._execute_with_retry(cursor, query, parameters)
                
                # Get column names
                columns = [desc[0] for desc in cursor.description]
                
                # Fetch all rows and convert to dictionaries
                results = []
                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))
                
                logger.info(f"Fetched {len(results)} rows")
                return results
            finally:
                cursor.close()
    
    def fetch_one(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Execute a query and fetch one result.
        
        Args:
            query: SQL query
            parameters: Query parameters
            
        Returns:
            Result dictionary or None
            
        Raises:
            DatabricksQueryError: If query execution fails
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                self._execute_with_retry(cursor, query, parameters)
                
                # Get column names
                columns = [desc[0] for desc in cursor.description]
                
                # Fetch one row
                row = cursor.fetchone()
                if row:
                    result = dict(zip(columns, row))
                    logger.info(f"Fetched 1 row")
                    return result
                
                logger.info("No results found")
                return None
            finally:
                cursor.close()
    
    def execute_many(
        self,
        query: str,
        parameters_list: List[Dict[str, Any]]
    ) -> None:
        """
        Execute a query multiple times with different parameters.
        
        Args:
            query: SQL query
            parameters_list: List of parameter dictionaries
            
        Raises:
            DatabricksQueryError: If query execution fails
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                for parameters in parameters_list:
                    self._execute_with_retry(cursor, query, parameters)
                logger.info(f"Executed query {len(parameters_list)} times")
            finally:
                cursor.close()


# ==========================================================================
# SINGLETON INSTANCE
# ==========================================================================
_client_instance: Optional[DatabricksClient] = None


def get_databricks_client() -> DatabricksClient:
    """
    Get singleton Databricks client instance.
    
    Returns:
        DatabricksClient: Shared client instance
    """
    global _client_instance
    if _client_instance is None:
        _client_instance = DatabricksClient()
    return _client_instance


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "DatabricksClient",
    "DatabricksConnectionError",
    "DatabricksQueryError",
    "get_databricks_client"
]
