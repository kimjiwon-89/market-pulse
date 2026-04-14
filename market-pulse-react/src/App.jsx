import { Route, Routes } from "react-router-dom";
import "./App.css";
import DefaultLayout from "./common/layouts/DefaultLayout";
import Home from "./common/pages/Home";
import MyPage from "./common/pages/MyPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/*" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
