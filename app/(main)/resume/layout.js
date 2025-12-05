import { Suspense } from "react";
import { BarLoader } from "react-spinners";

export default function Layout({ children }) {
  return (
    <div className="px-5 container mx-auto my-6">
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#36d7b7" />}
      >
        {children}
      </Suspense>
    </div>
  );
}