import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <nav className="flex items-center text-sm text-gray-400">
            <Link
                to="/dashboard"
                className="flex items-center hover:text-white transition-colors"
            >
                <Home size={14} className="mr-1" />
                Home
            </Link>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={14} className="mx-2 text-gray-600" />
                    {item.href ? (
                        <Link
                            to={item.href}
                            className="hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-white font-medium">
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
