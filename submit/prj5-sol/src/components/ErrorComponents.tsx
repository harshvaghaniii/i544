import { Errors } from "cs544-js-utils";
import React from "react";

const ErrorComponent = ({ errors }: { errors: Errors.Err[] }) => {
	return (
		<>
			{errors.map((error) => {
				return (
					<li key={error.message} className="error">
						{error.message}
					</li>
				);
			})}
		</>
	);
};

export default ErrorComponent;
