import { fetchValidationConfig } from "@/lib/validation/config"
import { SignupForm } from "@/components/signup-form"

// 빌드 타임에 config fetch → SSG
export default async function SignupPage() {
  const validationConfig = await fetchValidationConfig()

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <SignupForm validationConfig={validationConfig} />
      </div>
    </div>
  )
}
