import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedGallery } from '@/components/home/FeaturedGallery'
import { Categories } from '@/components/home/Categories'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Testimonials } from '@/components/home/Testimonials'
import { CTASection } from '@/components/home/CTASection'

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <FeaturedGallery />
            <Categories />
            <HowItWorks />
            <Testimonials />
            <CTASection />
        </>
    )
}
