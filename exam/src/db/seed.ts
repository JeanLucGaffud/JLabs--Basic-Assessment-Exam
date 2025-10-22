import 'dotenv/config'
import { auth } from '@/lib/auth'

async function seed() {
    try {
        
        await auth.api.signUpEmail({
            body: {
                email: "test@example.com",
                password: "password123",
                name: "Test User"
            }
        })

        console.log("Seed completed: Test user created with email: test@example.com, password: password123")
    } catch (error) {
        console.error("Error seeding database:", error)
    }
}

seed().catch(console.error)