#
# Imports
#

# Perso

#
# Exceptions
#

class AppError(Exception):
    """
        Base application error with user-safe messages.

        Params:
            - user_safe_title (str): Short title safe to show in UI.
            - user_safe_description (str): Longer description for the user.
            - dev (str): Technical detail for logs / developers.
            - status_code (int): HTTP status the view should return (400 by default).
    """

    def __init__(
        self,
        user_safe_title: str,
        user_safe_description: str,
        dev: str = "",
        status_code: int = 400,
    ) -> None:
        self.user_safe_title = user_safe_title
        self.user_safe_description = user_safe_description
        self.dev = dev or user_safe_description
        self.status_code = status_code
        super().__init__(self.dev)

    def to_detail(self) -> dict[str, str]:
        """
            Returns:
                - Dict matching the frontend ErrorSchema contract.
        """
        return {
            "user_safe_title": self.user_safe_title,
            "user_safe_description": self.user_safe_description,
            "dev": self.dev,
        }


class NotFoundError(AppError):
    """
        Resource not found (404), same detail contract as AppError.
    """

    def __init__(self, user_safe_title: str, user_safe_description: str, dev: str = "") -> None:
        super().__init__(user_safe_title, user_safe_description, dev, status_code=404)
