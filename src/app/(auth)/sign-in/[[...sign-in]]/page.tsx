import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="mt-2 text-gray-600">Sign in to your DentalPMS account</p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-xl border-0",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
                            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                        }
                    }}
                />
            </div>
        </div>
    )
}
