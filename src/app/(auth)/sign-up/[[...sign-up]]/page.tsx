import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="mt-2 text-gray-600">Get started with DentalPMS</p>
                </div>
                <SignUp
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
