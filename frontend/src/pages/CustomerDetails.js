import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const CustomerDetails = () => {
  const { name } = useParams(); // Get the customer name from the URL
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Use the name to filter customers or get a specific customer
        // You might need to adjust this endpoint depending on your API
        const response = await axios.get(`/api/customer?name=${name}`, {
          headers,
        });

        // Assuming the API returns an array, you might need to get the first match
        setCustomer(response.data[0] || null);
        setLoading(false);
      } catch (err) {
        setError("Failed to load customer details");
        setLoading(false);
        console.error(err);
      }
    };

    fetchCustomerDetails();
  }, [name]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!customer) return <div>No customer found with name: {name}</div>;

  return (
    <div className="card">
      <h1>Customer Details</h1>
      <div className="customer-details">
        <h2>{customer.Name}</h2>
        <p>
          <strong>Email:</strong> {customer.Email}
        </p>
        <p>
          <strong>Date of Birth:</strong> {customer.DateOfBirth}
        </p>
        <p>
          <strong>Phone Number:</strong> {customer.PhoneNumber}
        </p>
        {/* Display other customer details as needed */}
      </div>
      {/* You can add account information, transaction history, etc. here */}
    </div>
  );
};

export default CustomerDetails;
