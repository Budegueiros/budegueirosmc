import { useState } from "react";
import { Menu } from "lucide-react";
import letreiro from "../../img/letreiro.png";
import Nav from "../Nav";
import MenuBar from "../MenuBar";
export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-black w-screen h-16 justify-center overflow-visible">
        <div className="w-4/5 justify-between items-center md:text-4xl">
          <div className="hidden md:flex text-white text-2xl font-rebel-bones">
            BUDEGUEIROS MC
          </div>
          <div className="md:hidden">
            <img src={letreiro} alt="letreiro" />
          </div>
          <Menu
            onClick={() => setIsOpen(!isOpen)}
            className="text-white md:hidden"
          />
          <MenuBar/>
        </div>
      </div>
      {isOpen && (
        <Nav/>
      )}
    </>
  );
}
