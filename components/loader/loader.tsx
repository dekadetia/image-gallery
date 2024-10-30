function Loader() {
  return (
    <div className="w-full grid h-[calc(100vh-300px)] place-items-center">
      <div className="loader">
        <span className="loader__element"></span>
        <span className="loader__element"></span>
        <span className="loader__element"></span>
        <span className="loader__element"></span>
      </div>
    </div>
  );
}

export default Loader;
