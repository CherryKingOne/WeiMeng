from src.shared.domain.exceptions import DomainException, AuthenticationException

class UserNotFoundException(DomainException):
    def __init__(self, identifier: str):
        super().__init__(
            message="User not found",
            code=404,
            detail=f"User with identifier '{identifier}' does not exist"
        )

class UserAlreadyExistsException(DomainException):
    def __init__(self, email: str):
        super().__init__(
            message="User already exists",
            code=400,
            detail=f"User with email '{email}' already registered"
        )

class InvalidCredentialsException(AuthenticationException):
    def __init__(self):
        super().__init__(
            message="Invalid credentials",
            detail="Email or password is incorrect"
        )

class UserInactiveException(DomainException):
    def __init__(self):
        super().__init__(
            message="User is inactive",
            code=403,
            detail="User account has been deactivated"
        )
