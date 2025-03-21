export interface IOwner {
  FirstName: string;
  LastName: string;
  OwnerKey: string;
  Email: string | null;
  CellPhone: string | null;
  Phone: string | null;
  MailingAddress: string | null;
  MailCity: string | null;
  MailState: string | null;
  MailZipCode: string | null;
  PhysicalAddress: string | null;
  PhysicalCity: string | null;
  PhysicalState: string | null;
  PhysicalZipCode: string | null;
  SecondLastName: string | null;
  SecondFirstName: string | null;
  SecondCtctEmail: string | null;
  SecondCtctPhone: string | null;
}
