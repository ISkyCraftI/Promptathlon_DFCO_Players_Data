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
    """

    def __init__(
        self,
        user_safe_title: str,
        user_safe_description: str,
        dev: str = "",
    ) -> None:
        self.user_safe_title = user_safe_title
        self.user_safe_description = user_safe_description
        self.dev = dev or user_safe_description
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
