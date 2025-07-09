import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import SignUp from "../pages/SignUp.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import ChooseLanguage from "../pages/ChooseLanguage.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import LanguageGuard from "../components/common/LanguageGuard.jsx";
import Settings from "../pages/Settings.jsx";
import Profile from "../pages/Profile.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, 
    children: [
      { index: true, element: <Home /> },
      { path: "choose-language", element: <ChooseLanguage /> },
      { 
        path: "login", 
        element: (
          <LanguageGuard>
            <Login />
          </LanguageGuard>
        )
      },
      { 
        path: "signup", 
        element: (
          <LanguageGuard>
            <SignUp />
          </LanguageGuard>
        )
      },
      { 
        path: "dashboard", 
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </LanguageGuard>
        )
      },
      {
        path: "settings",
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Settings/>
            </ProtectedRoute>
          </LanguageGuard>
        )
      },
      {
        path: "my-account",
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Profile/>
            </ProtectedRoute>
          </LanguageGuard>
        )
      }
    //   { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
