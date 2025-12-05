import React, { useState } from 'react';
import {
    HelpCircle, Book, MessageCircle, Mail, Phone, ChevronDown, ChevronUp,
    Sprout, MapPin, BarChart3, Cloud, AlertTriangle, FileText, ExternalLink
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './HelpSupport.css';

const HelpSupport = () => {
    const toast = useToast();
    const [openFaq, setOpenFaq] = useState(null);
    const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

    const faqs = [
        {
            id: 1,
            question: 'How does GeoCrop predict the best crop for my farm?',
            answer: 'GeoCrop uses a combination of satellite imagery (Sentinel-2), soil data, weather conditions, and machine learning algorithms to analyze your farmland. Our AI model considers factors like soil pH, nitrogen levels, rainfall patterns, and temperature to recommend the most suitable crops for your specific location.'
        },
        {
            id: 2,
            question: 'How accurate are the crop predictions?',
            answer: 'Our predictions typically achieve 85-95% accuracy depending on the quality of input data. The model has been trained on extensive agricultural datasets and continuously improves with more data. For best results, ensure you provide accurate soil parameters and select the correct location.'
        },
        {
            id: 3,
            question: 'How do I add my farm to the system?',
            answer: 'Go to "My Farms" from the navigation menu, click "Add Farm", then either use the auto-detect feature to get your current GPS location or manually enter coordinates. You can also click on the map to select your farm location. Add details like farm name, area, and soil type for better predictions.'
        },
        {
            id: 4,
            question: 'What data do I need to make a prediction?',
            answer: 'For a basic prediction, you need: 1) Farm location (coordinates), 2) Soil parameters (pH, nitrogen, phosphorus, potassium levels), 3) Rainfall data. The system will automatically fetch weather data based on your location. More accurate soil data leads to better predictions.'
        },
        {
            id: 5,
            question: 'How do weather alerts work?',
            answer: 'Weather alerts monitor conditions at your farm locations and notify you when extreme weather is detected. This includes high/low temperatures, heavy rainfall, strong winds, and humidity levels that could affect your crops. You can customize alert preferences in Settings.'
        },
        {
            id: 6,
            question: 'Can I export my prediction history?',
            answer: 'Yes! Go to the History page and click the "Export CSV" button to download all your predictions. You can also generate detailed PDF reports from the Reports page with charts and analytics.'
        },
        {
            id: 7,
            question: 'Is my data secure?',
            answer: 'Your data is stored locally on your device using browser localStorage. We do not collect, store, or share your personal information on external servers. You can export or delete your data anytime from Settings > Privacy & Data.'
        }
    ];

    const guides = [
        { icon: Sprout, title: 'Getting Started', desc: 'Learn the basics of GeoCrop', link: '#' },
        { icon: MapPin, title: 'Adding Farms', desc: 'How to register your farmland', link: '#' },
        { icon: BarChart3, title: 'Understanding Reports', desc: 'Interpret your analytics', link: '#' },
        { icon: Cloud, title: 'Weather Features', desc: 'Using weather data effectively', link: '#' },
        { icon: AlertTriangle, title: 'Alert System', desc: 'Configure notifications', link: '#' },
        { icon: FileText, title: 'Export & Reports', desc: 'Download your data', link: '#' }
    ];

    const handleContactSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send to a backend
        console.log('Contact form submitted:', contactForm);
        toast.success('Message sent! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="help-page">
            <div className="help-header">
                <HelpCircle size={28} />
                <h1>Help & Support</h1>
            </div>
            <p className="help-subtitle">Find answers, guides, and get in touch with us</p>

            {/* Quick Guides */}
            <section className="help-section">
                <h2><Book size={20} /> Quick Guides</h2>
                <div className="guides-grid">
                    {guides.map((guide, i) => (
                        <div key={i} className="guide-card" onClick={() => toast.info('Guide coming soon!')}>
                            <guide.icon size={24} />
                            <h3>{guide.title}</h3>
                            <p>{guide.desc}</p>
                            <ExternalLink size={16} className="guide-link" />
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQs */}
            <section className="help-section">
                <h2><MessageCircle size={20} /> Frequently Asked Questions</h2>
                <div className="faq-list">
                    {faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className={`faq-item ${openFaq === faq.id ? 'open' : ''}`}
                        >
                            <button
                                className="faq-question"
                                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                            >
                                <span>{faq.question}</span>
                                {openFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {openFaq === faq.id && (
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Section */}
            <section className="help-section">
                <h2><Mail size={20} /> Contact Us</h2>
                <div className="contact-grid">
                    <div className="contact-info">
                        <h3>Get in Touch</h3>
                        <p>Have questions or feedback? We'd love to hear from you!</p>

                        <div className="contact-methods">
                            <div className="contact-method">
                                <Mail size={20} />
                                <div>
                                    <span className="method-label">Email</span>
                                    <span className="method-value">support@geocrop.com</span>
                                </div>
                            </div>
                            <div className="contact-method">
                                <Phone size={20} />
                                <div>
                                    <span className="method-label">Phone</span>
                                    <span className="method-value">+91 1800-XXX-XXXX</span>
                                </div>
                            </div>
                        </div>

                        <div className="support-hours">
                            <h4>Support Hours</h4>
                            <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                            <p>Saturday: 10:00 AM - 2:00 PM IST</p>
                        </div>
                    </div>

                    <form className="contact-form" onSubmit={handleContactSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    placeholder="Your email"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <select
                                value={contactForm.subject}
                                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                required
                            >
                                <option value="">Select a topic</option>
                                <option value="general">General Inquiry</option>
                                <option value="technical">Technical Support</option>
                                <option value="feedback">Feedback</option>
                                <option value="bug">Report a Bug</option>
                                <option value="feature">Feature Request</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                value={contactForm.message}
                                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                placeholder="How can we help you?"
                                rows={5}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            <Mail size={16} />
                            Send Message
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default HelpSupport;
