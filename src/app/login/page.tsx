import { LoginForm } from "@/modules/auth/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params?.next ?? "/salud";

  return <LoginForm nextPath={nextPath} />;
}
