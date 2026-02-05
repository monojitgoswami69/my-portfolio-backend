from typing import Optional, Any


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(message, status_code=401, details=details)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message, status_code=404, details=details)


class GitHubError(AppException):
    def __init__(self, message: str = "GitHub operation failed", details: Optional[Any] = None):
        super().__init__(message, status_code=502, details=details)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(message, status_code=400, details=details)
