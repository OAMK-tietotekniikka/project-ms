import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useStudentsContext } from '../../contexts/studentsContext';
import Papa from 'papaparse';

interface ImportStudentsProps {
  handleClose: () => void;
}

// Define a student structure that matches what we're importing
interface ImportedStudent {
  student_name: string;
  email: string;
  class_code: string;
}

const ImportStudents: React.FC<ImportStudentsProps> = ({ handleClose }) => {
  const { t } = useTranslation();
  const { addNewStudent } = useStudentsContext();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportedStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };


  const parseCSV = () => {
    if (!file) {
      setError(t('pleaseSelectFile'));
      return;
    }

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const handleImport = async () => {
          if (parsedData.length === 0) {
            setError(t('noDataToImport'));
            return;
          }
        
          setLoading(true);
          setError(null);
          setSuccess(null);
        
          console.log('Starting import of', parsedData.length, 'students');
          
          try {
            let newCount = 0;
            let updateCount = 0;
            let errorDetails = [];
            
            for (const student of parsedData) {
              try {
                console.log('Importing student:', JSON.stringify(student));
                
                // Split the name into first and last name
                let firstName = '';
                let lastName = '';
                
                if (student.student_name) {
                  const nameParts = student.student_name.split(' ');
                  firstName = nameParts[0] || '';
                  lastName = nameParts.slice(1).join(' ') || '';
                }
                
                // Use try/catch for each student to continue even if one fails
                const response = await addNewStudent({
                  student_name: student.student_name,
                  email: student.email,
                  class_code: student.class_code
                });
                
                console.log('Server response:', JSON.stringify(response));
                
                if (response) {
                  // Check if this was an update (200) or a new student (201)
                  if (response.statusCode === 200) {
                    updateCount++;
                    console.log(`Updated existing student ${student.email}`);
                  } else {
                    newCount++;
                    console.log(`Created new student ${student.email}`);
                  }
                } else {
                  console.error(`Failed to import student ${student.email}: No response data`);
                  errorDetails.push({email: student.email, error: 'No response data'});
                }
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                console.error(`Error adding student ${student.email}:`, errorMsg);
                errorDetails.push({email: student.email, error: errorMsg});
              }
            }
            
            console.log(`Import completed: ${newCount} new, ${updateCount} updated, ${errorDetails.length} failed`);
            
            if (newCount > 0 || updateCount > 0) {
              setSuccess(t('importSuccess', { count: newCount, updateCount: updateCount }));
              if (errorDetails.length > 0) {
                // Show error details for debugging
                console.error('Failed imports:', errorDetails);
                setError(t('partialImportFailed', { count: errorDetails.length }));
              }
              setPreviewMode(false);
              setParsedData([]);
              setFile(null);
            } else {
              setError(t('allImportsFailed'));
              console.error('All imports failed. Details:', JSON.stringify(errorDetails));
            }
          } catch (error) {
            setError(t('importError'));
            console.error('Import error:', error);
          } finally {
            setLoading(false);
          }
        };        console.log('CSV parsing results:', results);
        
        // Check if we have data
        if (!results.data || results.data.length === 0) {
          setError(t('noDataInCSV'));
          setLoading(false);
          return;
        }
        
        // Check if CSV has required columns
        const firstRow = results.data[0] as any;
        console.log('First row:', firstRow);
        
        if (!firstRow || (typeof firstRow !== 'object')) {
          setError(t('invalidCSVFormat'));
          setLoading(false);
          return;
        }
        
        // Check column names (case-insensitive)
        const columnNames = Object.keys(firstRow).map(key => key.toLowerCase());
        console.log('Column names:', columnNames);
        
        const hasNameColumn = columnNames.some(col => 
          col === 'name' || col === 'student_name' || col === 'studentname'
        );
        
        const hasEmailColumn = columnNames.some(col => 
          col === 'email' || col === 'student_email' || col === 'mail'
        );

        const hasClassCodeColumns = columnNames.some(col =>
            col === 'group' || col === 'class_code' || col === 'code' || col === 'class'
        );


        if (!hasNameColumn || !hasEmailColumn) {
          setError(t('csvMissingColumns'));
          setLoading(false);
          return;
        }
        
        // Map CSV data to our format, accounting for different possible column names
        const mapped = results.data.map((row: any) => {
          // Find the name and email columns (case-insensitive)
          const nameKey = Object.keys(row).find(key => 
            key.toLowerCase() === 'name' || 
            key.toLowerCase() === 'student_name' || 
            key.toLowerCase() === 'studentname'
          ) || '';
          
          const emailKey = Object.keys(row).find(key => 
            key.toLowerCase() === 'email' || 
            key.toLowerCase() === 'student_email' || 
            key.toLowerCase() === 'mail'
          ) || '';

          const classCodeKey = Object.keys(row).find(key =>
              key.toLowerCase() === 'group' ||
              key.toLowerCase() === 'class_code' ||
              key.toLowerCase() === 'code' ||
              key.toLowerCase() === 'class'
          ) || '';
          
          return {
            student_name: row[nameKey],
            email: row[emailKey],
            class_code: row[classCodeKey] || null
          };
        }).filter(student => student.student_name && student.email);

        console.log('Mapped data:', mapped);
        
        if (mapped.length === 0) {
          setError(t('noValidDataInCSV'));
          setLoading(false);
          return;
        }
        
        setParsedData(mapped);
        setPreviewMode(true);
        setLoading(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setError(`${t('csvParseError')}: ${error.message}`);
        setLoading(false);
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError(t('noDataToImport'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log('Starting import of', parsedData.length, 'students');
    
    try {
      let newCount: number = 0;
      let updateCount: number = 0;
      let errorDetails = [];
      let errorEmails: Set<string> = new Set();
      
      for (const student of parsedData) {
        try {
          console.log('Importing student:', JSON.stringify(student));


          
          // Use try/catch for each student to continue even if one fails
          const response = await addNewStudent({
            student_name: student.student_name,
            email: student.email,
            class_code: student.class_code
          });
          
          console.log('Server response:', JSON.stringify(response));
          
          if (response) {
            // Check if this was an update (200) or a new student (201)
            if (response.statusCode === 200) {
              updateCount++;
              console.log(`Updated existing student ${student.email}`);
            } else {
              newCount++;
              console.log(`Created new student ${student.email}`);
            }
          } else {
            console.error(`Failed to import student ${student.email}: No response data`);
            errorEmails.add(student.email);

            //errorDetails.push({email: student.email, error: 'No response data'}); will be changed

          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errorEmails.add(student.email);
          console.error(`Error adding student ${student.email}:`, errorMsg);


          //errorDetails.push({email: student.email, error: errorMsg}); will be changed
        }
      }
      
      console.log(`Import completed: ${newCount} new, ${updateCount} updated, ${errorDetails.length} failed`);
      
      if (newCount > 0 || updateCount > 0) {
        setSuccess(t('importSuccess', { count: newCount, updateCount: updateCount }));
        if (errorEmails.size) {

          console.error('Failed imports:', errorDetails);
          setError(t('partialImportFailed', {
            count: errorEmails.size,
            emails: [...errorEmails].join(', ')
          }));
        }
        setPreviewMode(false);
        setParsedData([]);
        setFile(null);
      } else {
        setError(t('allImportsFailed'));
        console.error('All imports failed. Details:', JSON.stringify(errorDetails));
      }
    } catch (error) {
      setError(t('importError'));
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log('API connection successful');
        return true;
      } else {
        console.error('API connection failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to API:', error);
      return false;
    }
  };

  useEffect(() => {
    checkApiConnection();
  }, []);

  return (
    <div className="import-students-container">
      <h5>{t('importStudentsToClass')}</h5>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {!previewMode ? (
        <>

          <Form.Group controlId="csvFile" className="mb-3">
            <Form.Label>{t('csvFile')}</Form.Label>
            <Form.Control 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
            />
            <Form.Text className="text-muted">
              {t('csvFormatHint')}
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="secondary" 
              onClick={handleClose} 
              className="me-2"
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button 
              variant="primary" 
              onClick={parseCSV}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  {t('loading')}
                </>
              ) : (
                t('previewData')
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3">
            <span className="ms-3">
              <strong>{t('totalRecords')}:</strong> {parsedData.length}
            </span>
          </div>

          <div className="table-responsive mb-3" style={{ maxHeight: '300px' }}>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('studentName')}</th>
                  <th>{t('email')}</th>
                  <th>{t('classCode')}</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((student, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{student.student_name}</td>
                    <td>{student.email}</td>
                    <td>{student.class_code}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-end">
            <Button 
              variant="secondary" 
              onClick={() => setPreviewMode(false)} 
              className="me-2"
              disabled={loading}
            >
              {t('back')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  {t('importing')}
                </>
              ) : (
                t('importStudents')
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportStudents;