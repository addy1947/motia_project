import { useState, useEffect } from 'react';
import Respond from './Respond';
import NewEntry from './NewEntry';
import DocumentUpload from './DocumentUpload';
import EmployeeDetailsForm from './EmployeeDetailsForm';

import KitConfirmation from './KitConfirmation';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (path === '/kit-confirmation') {
    return <KitConfirmation />;
  }

  if (path === '/respond') {
    return <Respond />;
  }

  if (path === '/submitform/document') {
    return <DocumentUpload />;
  }

  if (path === '/submitform/detail') {
    return <EmployeeDetailsForm />;
  }

  // Default to NewEntry for home path or any other path (for now)
  return <NewEntry />;
}

export default App;
