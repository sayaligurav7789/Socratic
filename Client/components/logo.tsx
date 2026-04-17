import Image from "next/image";

export default function Logo() {
    return (
        <div className="absolute top-6 left-6">
            <Image
                src="/logo.svg"
                alt="Logo"
                width={200}
                height={200}
                
                priority
            />
        </div>
    );
}