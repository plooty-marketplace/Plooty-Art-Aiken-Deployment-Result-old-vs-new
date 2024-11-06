// islands/Counter.tsx
import { useSignal } from "@preact/signals";

const Counter = ({ count }) => {
  const increment = () => {
    count.value++; // Increment the count signal
  };

  const decrement = () => {
    if (count.value > 1) { // Prevent going below 1
      count.value--; // Decrement the count signal
    }
  };

  return (
    <div>
      <h2>Gift Card Purchase</h2>
      <p>Number of Gift Cards: {count.value}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <p>
        <strong>Total Amount:</strong> ${count.value * 10} {/* Assuming each gift card costs $10 */}
      </p>
    </div>
  );
};

export default Counter;
