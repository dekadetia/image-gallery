import { FaInstagram } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";
import { HiBars3BottomRight } from "react-icons/hi2";

export default function NavigationBar() {
    return (
        <div className="w-full flex justify-between items-center py-9">
            <div className="flex gap-10">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
                    TALVA
                </h2>

                <ul className="hidden md:flex gap-6 items-center text-sm">
                    <li className="cursor-pointer">Blog</li>
                    <li className="cursor-pointer">Contact</li>
                    <li className="cursor-pointer">About</li>
                </ul>
            </div>

            {/* Social icons */}
            <div className="hidden md:flex items-center gap-4">
                <FaInstagram />
                <FaTwitter />
            </div>

            {/* Mobile Hamburger menu */}
            <HiBars3BottomRight className="md:hidden text-2xl cursor-pointer" /> 
        </div>
    )
}
