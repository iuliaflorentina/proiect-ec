import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedGallery } from '@/components/home/FeaturedGallery'
import { Categories } from '@/components/home/Categories'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Testimonials } from '@/components/home/Testimonials'
import { CTASection } from '@/components/home/CTASection'
import { useAuth } from '@/context/AuthContext'

export default function HomePage() {
    const { isAdmin } = useAuth()
    
    return (
        <>
            <HeroSection />
            {!isAdmin && (
                <>
                    <FeaturedGallery />
                    <Categories />
                    <HowItWorks />
                    <Testimonials />
                    <CTASection />
                </>
            )}
        </>
    )
}
