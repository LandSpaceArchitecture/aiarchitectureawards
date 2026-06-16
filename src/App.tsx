import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Submit from "./pages/Submit";
import ProjectDetail from "./pages/ProjectDetail";
import Admin from "./pages/Admin";
import Jury from "./pages/Jury";
import Login from "./pages/Login";
import Gallery from "./pages/Gallery";
import MySubmissions from "./pages/MySubmissions";
import FAQ from "./pages/FAQ";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="categories" element={<Categories />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="submit" element={<Submit />} />
            <Route path="my-submissions" element={<MySubmissions />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="project/:id" element={<ProjectDetail />} />
            <Route path="admin" element={<Admin />} />
            <Route path="jury" element={<Jury />} />
            <Route path="login" element={<Login />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
