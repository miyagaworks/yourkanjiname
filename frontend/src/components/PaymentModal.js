import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './PaymentModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Load Stripe outside of component to avoid recreating on re-render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Payment form component
const PaymentForm = ({ onSuccess, onCancel, amount, kanjiName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else {
      setErrorMessage('Payment was not completed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-info">
        <div className="payment-amount">
          <span className="label">Amount:</span>
          <span className="value">${(amount / 100).toFixed(2)} USD</span>
        </div>
        {kanjiName && (
          <div className="payment-kanji">
            <span className="label">Kanji Name:</span>
            <span className="value kanji">{kanjiName}</span>
          </div>
        )}
      </div>

      <PaymentElement className="payment-element" />

      {errorMessage && (
        <div className="payment-error">{errorMessage}</div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          onClick={onCancel}
          className="payment-cancel-btn"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="payment-submit-btn"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

// Main PaymentModal component
const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  sessionId,
  partnerCode,
  customerEmail,
  kanjiName
}) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const amount = 500; // $5.00 in cents

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setLoading(true);
      setError(null);
      return;
    }

    // Create payment intent when modal opens
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stripe/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            partner_code: partnerCode || null,
            customer_email: customerEmail || null,
            kanji_name: kanjiName || null
          })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [isOpen, sessionId, partnerCode, customerEmail, kanjiName]);

  const handleSuccess = (paymentIntent) => {
    onSuccess(paymentIntent);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#c75450',
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
      }
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Your Purchase</h2>
          <button className="payment-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="payment-modal-content">
          {loading && (
            <div className="payment-loading">
              <div className="spinner"></div>
              <p>Preparing payment...</p>
            </div>
          )}

          {error && (
            <div className="payment-error-container">
              <p>{error}</p>
              <button onClick={onClose} className="payment-cancel-btn">
                Close
              </button>
            </div>
          )}

          {clientSecret && !loading && !error && (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentForm
                onSuccess={handleSuccess}
                onCancel={onClose}
                amount={amount}
                kanjiName={kanjiName}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
