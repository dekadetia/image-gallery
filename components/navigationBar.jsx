import Link from "next/link";
import { IoMdList } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import { IoMdShuffle } from "react-icons/io";

export default function NavigationBar() {
    return (
        <div className="w-full flex justify-center items-center py-9">
            <div className="w-full grid place-items-center space-y-6">

                <Link href={"/"} >
                    <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
                </Link>

                <div className="flex gap-4">
                    <Link href={"/indx"}>
                        <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105" />
                    </Link>
                    <Link href={"/ordr"}>
                        <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-xl" />
                    </Link>
                    <Link href={"/rndm"}>
                        <IoMdShuffle className="cursor-pointer transition-all duration-200 hover:scale-105" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
