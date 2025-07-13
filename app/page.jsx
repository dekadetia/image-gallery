<RootLayout>
  {/* Invisible dev button to toggle autosMode */}
  <button
    onClick={() => setAutosMode(true)}
    style={{
      position: "fixed",
      top: "10px",
      right: "10px",
      width: "30px",
      height: "30px",
      opacity: 0,
      cursor: "pointer",
      zIndex: 9999
    }}
    aria-hidden="true"
    tabIndex={-1}
  />

  {/* Header/Nav only shown when not in autosMode */}
  {!autosMode && (
    <div className="w-full flex justify-center items-center py-9">
      <div className="w-full grid place-items-center space-y-6">
        <Link href={"/"}>
          <img
            src="/assets/logo.svg"
            className="object-contain w-40"
            alt=""
          />
        </Link>

        <div className="flex gap-8 items-center">
          <Link href={"/indx"}>
            <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
          </Link>

          <Link href={"/ordr"}>
            <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
          </Link>

          <Link href={"/rndm"}>
            <IoMdShuffle className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
          </Link>
        </div>
      </div>
    </div>
  )}

  {/* MasonaryGrid full width in autosMode */}
  <div className={autosMode ? "w-full" : "px-4 lg:px-16 pb-10"}>
    <MasonaryGrid />
  </div>

  {/* Bottom logo only if NOT autosMode */}
  {!autosMode && (
    <div className="flex justify-center items-center mt-10">
      <img src="/assets/logo.svg" className="w-24 opacity-50" alt="" />
    </div>
  )}
</RootLayout>
