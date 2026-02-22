import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/types';

interface CategoryCardProps {
    category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
    return (
        <Link href={`/shop?category=${category.slug}`} className="group relative block">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#ee626b]/0 group-hover:bg-[#ee626b]/10 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h4 className="text-lg font-bold text-white drop-shadow-md">
                        {category.name}
                    </h4>
                    <p className="text-xs text-white/70 font-medium mt-0.5">Jelajahi →</p>
                </div>
            </div>
        </Link>
    );
}
