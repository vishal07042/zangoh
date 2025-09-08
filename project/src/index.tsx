import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./screens/Dashboard/Dashboard";
import { Conversations } from "./screens/Conversations/Conversations";
import { Agents } from "./screens/Agents/Agents";
import { Templates } from "./screens/Templates/Templates";
import { Settings } from "./screens/Settings/Settings";

createRoot(document.getElementById("app") as HTMLElement).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={<Navigate to='/dashboard' replace />}
				/>
				<Route path='/dashboard' element={<Dashboard />} />
				<Route path='/conversations' element={<Conversations />} />
				<Route path='/agents' element={<Agents />} />
				<Route path='/templates' element={<Templates />} />
				<Route path='/settings' element={<Settings />} />
				<Route
					path='*'
					element={<Navigate to='/dashboard' replace />}
				/>
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
