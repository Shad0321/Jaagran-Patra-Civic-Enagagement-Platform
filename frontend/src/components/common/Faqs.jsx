import React from 'react';
import { faqs } from '../../utils/constants';
import { useLocation } from 'react-router-dom';

const Faqs = () => {
  const [openIndex, setOpenIndex] = React.useState(null);
  const location = useLocation();

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about Jaagran Patra and how to get
            the most out of the platform.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow border border-green-100 overflow-hidden"
            >
              <button
                className={
                  'w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none transition-colors cursor-pointer' +
                  (openIndex === idx ? 'bg-green-50' : '')
                }
                onClick={() => toggle(idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span className="text-lg font-semibold text-green-700">
                  {faq.question}
                </span>
                <svg
                  className={
                    'w-6 h-6 ml-4 transform transition-transform duration-200 ' +
                    (openIndex === idx
                      ? 'rotate-180 text-green-600'
                      : 'text-gray-400')
                  }
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                id={`faq-answer-${idx}`}
                className={
                  'px-6 text-gray-700 text-base transition-all duration-300 ' +
                  (openIndex === idx
                    ? 'max-h-40 opacity-100 pb-5'
                    : 'max-h-0 opacity-0 overflow-hidden')
                }
                style={{
                  transitionProperty: 'max-height, opacity',
                }}
              >
                {openIndex === idx && <div>{faq.answer}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faqs;
