"use client";
import Link from "next/link";
import Navmenu from "./Navmenu";
import UseSticky from "@/hooks/UseSticky";
import { useState } from "react";
import MobileMenu from "./MobileMenu"; 
import { siteContent } from "@/content/site";
import { headerContent } from "@/content/header";
 

export default function HeaderOne() {
  const { sticky, hidden } = UseSticky();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <header className={`site-header azzle-header-section ${sticky ? "sticky-menu" : ""} ${hidden ? "hide-header" : ""}`} id="sticky-menu">
        <div className="container">
          <div className="row gx-3 align-items-center justify-content-between">
            <div className="col-8 col-sm-auto ">
              <div className="header-logo">
                <Link href={headerContent.logo.href ?? "/"}>
                  <img
                    src={headerContent.logo.src ?? siteContent.brand.logoDarkSrc}
                    alt={headerContent.logo.alt ?? siteContent.brand.name}
                    style={{ width: 230, height: "auto" }}
                  />   
                </Link>
              </div>
            </div>
            <div className="col">
              <div className="azzle-main-menu-item">
                <nav className="main-menu menu-style1 d-none d-lg-block menu-left">
                  <Navmenu />                   
                </nav>
              </div>
            </div>
            <div className="col-auto d-flex align-items-center">
              <div className="azzle-header-button-wraper">
                <div className="azzle-header-login-button button3">
                  <ul>
                    <li>
                      <Link href={headerContent.links.login.href ?? "/sign-in"}>
                        {headerContent.links.login.label ?? "Login"}
                      </Link>
                    </li>
                  </ul>
                </div>
                <Link
                  className="azzle-default-btn azzle-header-btn"
                  href={headerContent.links.primaryCta.href ?? siteContent.headerCta.href}
                  data-text={headerContent.links.primaryCta.label ?? siteContent.headerCta.label}
                >
                  <span className="button-wraper">
                    {headerContent.links.primaryCta.label ?? siteContent.headerCta.label}
                  </span>
                </Link>
              </div>
              <div className="azzle-header-menu">
                <nav className="navbar site-navbar justify-content-between">
                  {/* <!-- Brand Logo--> */}
                  {/* <!-- mobile menu trigger --> */}
                  <button onClick={() => setIsOpen(!isOpen)} className="azzle-menu-toggle d-inline-block d-lg-none">
                    <span></span>
                  </button>
                  {/* <!--/.Mobile Menu Hamburger Ends--> */}
                </nav>
              </div>
            </div>
          </div>
        </div>

      </header>
      <MobileMenu setIsOpen={setIsOpen} isOpen={isOpen} />
    </>
  )
}
