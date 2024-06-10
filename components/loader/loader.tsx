function Loader() {
    return (
        <div className="w-full h-screen fixed inset-0 grid place-items-end">
            <div className="w-full grid h-[80vh] place-items-center">
                <div className="loader">
                    <span className="loader__element"></span>
                    <span className="loader__element"></span>
                    <span className="loader__element"></span>
                    <span className="loader__element"></span>
                </div>
            </div>
        </div>
    )
}

export default Loader