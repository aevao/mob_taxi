export interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  billingAddress: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
  emailVerified: boolean;
  createdAt: string;
}
