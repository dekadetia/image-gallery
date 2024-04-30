export default function Page() {
    return (
        <div className="h-screen grid place-items-center">
            <form className="flex flex-col space-y-6 py-5 px-4 rounded-lg w-1/3 border border-solid border-white">
                <h2 className="w-full text-center text-2xl font-bold">Upload Images</h2>               

                <input class="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400" id="file_input" type="file" />

                <button className="bg-white text-black transition-all duration-300 hover:opacity-90 py-2">
                    Upload
                </button>
            </form>
        </div>
    )
}
