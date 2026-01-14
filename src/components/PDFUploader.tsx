import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFUploader.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  onTextExtracted,
  disabled = false,
  darkMode = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfSource, setPdfSource] = useState<File | string | null>(null);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const suggestedBooks = [
    {
      title: 'Фондацията',
      author: 'Isaac Asimov',
      url: 'https://m3.chitanka.info/cache/dl/Isaac-Asimov_-_Fondatsijata_-_1021-b.pdf'
    },
    {
      title: 'Лехуса',
      author: 'Васил Попов',
      url: 'https://rsvp-books.s3.eu-north-1.amazonaws.com/%D0%9B%D0%B5%D1%85%D1%83%D1%81%D0%B0+-+%D0%92%D0%B0%D1%81%D0%B8%D0%BB+%D0%9F%D0%BE%D0%BF%D0%BE%D0%B2+-+4eti.me.pdf'
    }
  ];

  const loadSuggestedBook = async (url: string) => {
    setPdfUrl(url);
    setShowSuggestions(false);
    
    // Auto-load the URL
    try {
      const proxies = [
        '',  // Try direct first
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://thingproxy.freeboard.io/fetch/',
      ];

      let success = false;
      let lastError = '';
      
      for (const proxy of proxies) {
        try {
          const loadUrl = proxy ? proxy + encodeURIComponent(url) : url;
          const response = await fetch(loadUrl);
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPdfSource(blobUrl);
            setFile(null);
            setCurrentPage(1);
            setPageTexts([]);
            success = true;
            break;
          } else {
            lastError = `${response.status} ${response.statusText}`;
          }
        } catch (e: any) {
          lastError = e.message;
          continue;
        }
      }

      if (!success) {
        alert(`Failed to load PDF from URL. Last error: ${lastError}\n\nTip: Download the PDF file and use the file upload option instead.`);
      }
    } catch (error) {
      console.error('Error loading PDF from URL:', error);
      alert('Failed to load PDF. Try downloading it and uploading the file instead.');
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPdfSource(selectedFile);
      setPdfUrl('');
      setCurrentPage(1);
      setPageTexts([]);
    }
  };

  const handleUrlLoad = async () => {
    if (!pdfUrl.trim()) return;

    try {
      // Try different CORS proxies
      const proxies = [
        '',  // Try direct first
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://thingproxy.freeboard.io/fetch/',
      ];

      let success = false;
      let lastError = '';
      
      for (const proxy of proxies) {
        try {
          const url = proxy ? proxy + encodeURIComponent(pdfUrl) : pdfUrl;
          const response = await fetch(url);
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPdfSource(blobUrl);
            setFile(null);
            setCurrentPage(1);
            setPageTexts([]);
            success = true;
            break;
          } else {
            lastError = `${response.status} ${response.statusText}`;
          }
        } catch (e: any) {
          lastError = e.message;
          continue;
        }
      }

      if (!success) {
        alert(`Failed to load PDF from URL. Last error: ${lastError}\n\nTip: Download the PDF file and use the file upload option instead.`);
      }
    } catch (error) {
      console.error('Error loading PDF from URL:', error);
      alert('Failed to load PDF. Try downloading it and uploading the file instead.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setEndPage(numPages);
  };

  const extractTextFromPage = async (pageNum: number) => {
    if (!pdfSource) return;

    try {
      let pdf;
      if (typeof pdfSource === 'string') {
        pdf = await pdfjs.getDocument(pdfSource).promise;
      } else {
        const arrayBuffer = await pdfSource.arrayBuffer();
        pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      }
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      setPageTexts(prev => {
        const newTexts = [...prev];
        newTexts[pageNum - 1] = text;
        return newTexts;
      });
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      if (!pageTexts[newPage - 1]) {
        extractTextFromPage(newPage);
      }
    }
  };

  const loadCurrentPageText = async () => {
    if (!pdfSource) return;

    try {
      let pdf;
      if (typeof pdfSource === 'string') {
        pdf = await pdfjs.getDocument(pdfSource).promise;
      } else {
        const arrayBuffer = await pdfSource.arrayBuffer();
        pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      }
      
      const page = await pdf.getPage(currentPage);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      onTextExtracted(text);
    } catch (error) {
      console.error('Error extracting text from current page:', error);
    }
  };

  const loadAllPagesText = async () => {
    if (!pdfSource) return;

    try {
      let pdf;
      if (typeof pdfSource === 'string') {
        pdf = await pdfjs.getDocument(pdfSource).promise;
      } else {
        const arrayBuffer = await pdfSource.arrayBuffer();
        pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      }
      
      const allTexts: string[] = [];
      const start = Math.max(1, startPage);
      const end = Math.min(numPages, endPage || numPages);

      for (let i = start; i <= end; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        allTexts.push(text);
      }

      setPageTexts(allTexts);
      onTextExtracted(allTexts.join('\n\n'));
    } catch (error) {
      console.error('Error extracting all text from PDF:', error);
    }
  };

  return (
    <div className={`pdf-uploader-container ${isExpanded ? 'expanded' : 'collapsed'} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="pdf-uploader-header">
        <h3>📄 PDF Reader</h3>
        <button
          className="action-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="pdf-url-section">
            <div className="input-with-clear">
              <input
                type="text"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="Paste PDF URL here..."
                disabled={disabled}
                className="pdf-url-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlLoad();
                }}
              />
              {pdfUrl && (
                <button
                  className="clear-btn"
                  onClick={() => setPdfUrl('')}
                  type="button"
                  aria-label="Clear URL"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleUrlLoad}
              disabled={disabled || !pdfUrl.trim()}
              className="load-url-btn"
            >
              Load URL
            </button>
          </div>

          <div className="suggestions-section">
            <button
              className="suggestions-toggle"
              onClick={() => setShowSuggestions(!showSuggestions)}
              type="button"
            >
              {showSuggestions ? '▼' : '▶'} Suggested Books
            </button>
            {showSuggestions && (
              <div className="suggestions-list">
                {suggestedBooks.map((book, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-info">
                      <span className="suggestion-title">{book.title}</span>
                      <span className="suggestion-author">{book.author}</span>
                    </div>
                    <button
                      className="suggestion-load-btn"
                      onClick={() => loadSuggestedBook(book.url)}
                      disabled={disabled}
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="separator">
            <span>or</span>
          </div>

          <div className="pdf-upload-section">
            <input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              disabled={disabled}
              id="pdf-file-input"
              className="pdf-file-input"
            />
            <label htmlFor="pdf-file-input" className="pdf-upload-label">
              {file ? file.name : 'Choose PDF file'}
            </label>
          </div>

          {pdfSource && (
            <>
              <div className="pdf-viewer">
                <Document
                  file={pdfSource}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="pdf-document"
                >
                  <Page 
                    pageNumber={currentPage} 
                    scale={scale}
                    className="pdf-page"
                  />
                </Document>
              </div>

              <div className="pdf-controls">
                <div className="page-navigation">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || disabled}
                    className="nav-btn"
                  >
                    ← Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= numPages || disabled}
                    className="nav-btn"
                  >
                    Next →
                  </button>
                </div>

                <div className="zoom-controls">
                  <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                    className="zoom-btn"
                    disabled={disabled}
                  >
                    -
                  </button>
                  <span className="zoom-info">{Math.round(scale * 100)}%</span>
                  <button
                    onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                    className="zoom-btn"
                    disabled={disabled}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pdf-actions">
                <div className="page-range-selector">
                  <label>From page:</label>
                  <div className="input-with-clear">
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={startPage}
                      onChange={(e) => setStartPage(Math.max(1, Math.min(numPages, parseInt(e.target.value) || 1)))}
                      className="page-input"
                      disabled={disabled}
                    />
                    {startPage !== 1 && (
                      <button
                        className="clear-btn clear-btn-small"
                        onClick={() => setStartPage(1)}
                        type="button"
                        aria-label="Reset to page 1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <label>To page:</label>
                  <div className="input-with-clear">
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={endPage}
                      onChange={(e) => setEndPage(Math.max(1, Math.min(numPages, parseInt(e.target.value) || numPages)))}
                      className="page-input"
                      disabled={disabled}
                    />
                    {endPage !== numPages && (
                      <button
                        className="clear-btn clear-btn-small"
                        onClick={() => setEndPage(numPages)}
                        type="button"
                        aria-label="Reset to last page"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={loadCurrentPageText}
                    disabled={disabled}
                    className="load-btn"
                  >
                    Load Current Page
                  </button>
                  <button
                    onClick={loadAllPagesText}
                    disabled={disabled}
                    className="load-btn load-btn-primary"
                  >
                    Load Pages {startPage}-{endPage}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
