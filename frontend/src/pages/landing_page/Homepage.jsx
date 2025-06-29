import React from "react";
import Navbar from "../../components/Navbar.jsx";
import Image from "../../components/Image.jsx";
import Footer from "../../components/Footer.jsx";
import About from "../../components/About.jsx";
import TaxManagement from "../../components/TaxManagement.jsx";

function Homepage() {
    return (
        <>
            <div className="parent">
                <TaxManagement />
                <Navbar />
                <Image />
                <About />
                <Footer />
            </div>

            {/* <Navbar />
            <About />
            <Footer /> */}
        </>
    );
}

export default Homepage;