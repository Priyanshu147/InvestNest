import React from 'react';
import './AboutUs.css'; // Assuming you have a separate CSS file for styling
import Navbar from '../Navbar/navbar';
import Footer from '../Footer/footer';
import sv from './new.svg';
const AboutUs = () => {
    return (
        <div className="homepage-container">
            <Navbar />
      {/* Heading Section */}
      <section className="heading-section">
        <div className="heading-text">
          <h1>Easy.<br />Fast.<br />Transparent.</h1>
          <p>Investing in India was none of the above.<br />
            But we’re changing that.<br />
            Super easy to use, lightning fast, and crystal clear.
          </p>
        </div>
        <div className="heading-image">
          <img src={sv} alt="People illustration" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>50 Million+</h3>
          <p>Customers</p>
        </div>
        <div className="stat-card">
          <h3>1000+</h3>
          <p>Team Members</p>
        </div>
        <div className="stat-card">
          <h3>4.5★</h3>
          <p>Rating</p>
        </div>
      </section>
      <Footer />
    </div>);
};

export default AboutUs;
