export class ErrorWrapper extends Error {
  //
  //   Properties
  //

  public readonly userSafeTitle: string;
  public readonly userSafeDescription: string;
  public readonly error: Error;

  constructor(
    userSafeTitle: string,
    userSafeDescription: string,
    error: Error,
  ) {
    super(error.message);

    this.name = "ErrorWrapper";
    this.userSafeTitle = userSafeTitle;
    this.userSafeDescription = userSafeDescription;
    this.error = error;
  }
}
