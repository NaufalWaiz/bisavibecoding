import { AuthForm } from "../auth-form";
import { register } from "../actions";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return <AuthForm mode="register" action={register} />;
}
