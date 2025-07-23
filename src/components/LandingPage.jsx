import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/rooms");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden p-4"
      style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-4xl flex-1 space-y-8">
            {/* Hero Section */}
            <div className="@container">
              <div className="@md:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @md:gap-8 @md:rounded-xl items-center justify-center p-8"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2339&q=80")',
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-4xl text-white font-black leading-tight tracking-tight @md:text-5xl @md:font-black @md:leading-tight @md:tracking-tight">
                      Chat Now
                    </h1>
                    <h2 className="text-sm font-normal text-white leading-normal @md:text-base @md:font-normal @md:leading-normal">
                      Connect instantly with friends and family. Enjoy seamless
                      real-time conversations across all your devices.
                    </h2>
                  </div>
                  <button
                    onClick={handleGetStarted}
                    className="flex min-w-24 max-w-md text-black cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 @md:h-12 @md:px-5 bg-emerald-200  text-sm font-bold leading-normal tracking-wide @md:text-base @md:font-bold @md:leading-normal @md:tracking-wide hover:bg-emerald-300 transition-colors"
                  >
                    <span className="truncate">Get Started</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Key Features Section */}
            <h2 className=" text-2xl font-bold leading-tight tracking-tight px-4 pb-4 pt-6">
              Key Features
            </h2>
            <div className="grid grid-cols-3 gap-4 p-4">
              <div className="flex flex-1 gap-3 rounded-lg border p-6 flex-col hover:shadow-md transition-shadow">
                <div
                  className=""
                  data-icon="ChatCircleDots"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className=" text-base font-bold leading-tight">
                    Real-Time Messaging
                  </h2>
                  <p className="text-muted-foreground text-sm font-normal leading-normal">
                    Experience instant messaging with real-time updates.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 gap-3 rounded-lg border p-6 flex-col hover:shadow-md transition-shadow">
                <div
                  className=""
                  data-icon="Users"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className=" text-base font-bold leading-tight">
                    Group Chats
                  </h2>
                  <p className="text-muted-foreground text-sm font-normal leading-normal">
                    Create and manage group chats with friends and family.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 gap-3 rounded-lg border p-6 flex-col hover:shadow-md transition-shadow">
                <div
                  className=""
                  data-icon="ShieldCheck"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm0,74.79c0,78.42-66.35,104.62-80,109.18-13.53-4.51-80-30.69-80-109.18V56H208ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.68l50.34-50.34a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className=" text-base font-bold leading-tight">
                    Secure & Private
                  </h2>
                  <p className="text-muted-foreground text-sm font-normal leading-normal">
                    Your messages are protected with modern security measures.
                  </p>
                </div>
              </div>
            </div>

            {/* User Testimonials Section */}
            <h2 className=" text-2xl font-bold leading-tight tracking-tight px-4 pb-4 pt-6">
              User Testimonials
            </h2>
            <div className="flex overflow-y-auto">
              <div className="flex items-stretch p-4 gap-4">
                <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80")',
                    }}
                  ></div>
                  <div>
                    <p className=" text-base font-medium leading-normal">
                      Sarah M.
                    </p>
                    <p className="text-muted-foreground text-sm font-normal leading-normal">
                      "This chat app has transformed how I communicate with my
                      loved ones. The real-time messaging is incredibly fast and
                      reliable."
                    </p>
                  </div>
                </div>

                <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80")',
                    }}
                  ></div>
                  <div>
                    <p className=" text-base font-medium leading-normal">
                      David L.
                    </p>
                    <p className="text-muted-foreground text-sm font-normal leading-normal">
                      "I love the group chat feature! It's so easy to stay
                      connected with all my friends at once."
                    </p>
                  </div>
                </div>

                <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80")',
                    }}
                  ></div>
                  <div>
                    <p className=" text-base font-medium leading-normal">
                      Emily R.
                    </p>
                    <p className="text-muted-foreground text-sm font-normal leading-normal">
                      "The security features give me peace of mind knowing my
                      conversations are protected and private."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="@container">
              <div className="flex flex-col justify-end gap-6 px-4 py-10 @md:gap-8 @md:px-10 @md:py-20">
                <div className="flex flex-col gap-2 text-center">
                  <h1 className=" tracking-light text-3xl font-bold leading-tight @md:text-4xl @md:font-black @md:leading-tight @md:tracking-tight max-w-3xl mx-auto">
                    Ready to Get Started?
                  </h1>
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="flex justify-center">
                    <button
                      onClick={handleGetStarted}
                      className="flex min-w-24 max-w-xs text-black cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 @md:h-12 @md:px-5 bg-emerald-200  text-sm font-bold leading-normal tracking-wide @md:text-base @md:font-bold @md:leading-normal @md:tracking-wide hover:bg-emerald-300 transition-colors grow"
                    >
                      Sign Up Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
