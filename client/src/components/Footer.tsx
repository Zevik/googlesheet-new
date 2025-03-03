import React from 'react';

interface FooterProps {
  footerText: string;
}

const Footer: React.FC<FooterProps> = ({ footerText }) => {
  return (
    <footer className="bg-white border-t p-4 text-center text-neutral-500 text-sm">
      <div className="max-w-5xl mx-auto">
        <p>{footerText}</p>
      </div>
    </footer>
  );
};

export default Footer;
