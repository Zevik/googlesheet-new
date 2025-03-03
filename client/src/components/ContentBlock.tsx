import React from 'react';
import { ContentBlock as ContentBlockType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ContentBlockProps {
  block: ContentBlockType;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ block }) => {
  // Convert content_type to lowercase for case-insensitive comparison
  const contentType = (block.content_type || '').toLowerCase();
  console.log('Content type:', block.content_type, 'Lowercase:', contentType);
  
  // פונקציה להמרת מחרוזת כותרת לרמה ותוכן
  const parseTitleContent = (titleText: string) => {
    const headingMatch = titleText.match(/^h([1-6]):\s*(.+)$/);
    if (headingMatch) {
      return {
        level: parseInt(headingMatch[1]),
        content: headingMatch[2].trim()
      };
    }
    return { level: 2, content: titleText }; // ברירת מחדל אם אין פורמט מיוחד
  };

  // פונקציה להמרת כותרת ורמה מפורמט משולב כמו "h2: כותרת" או מפורמט מופרד (content = "כותרת", title = "h2")
  const extractTitleContent = (block: ContentBlockType) => {
    // נסה את שדה title קודם, זה המקום הסטנדרטי לכותרות
    if (block.title) {
      // אם יש פורמט של "h2: כותרת" בשדה title
      const headingMatch = block.title.match(/^h([1-6]):\s*(.+)$/);
      if (headingMatch) {
        return {
          level: parseInt(headingMatch[1]),
          content: headingMatch[2].trim()
        };
      }
      
      // אם אין פורמט מיוחד בשדה title, בדוק אם יש בשדה content
      if (block.content) {
        const contentHeadingMatch = block.content.match(/^h([1-6]):\s*(.+)$/);
        if (contentHeadingMatch) {
          return {
            level: parseInt(contentHeadingMatch[1]),
            content: contentHeadingMatch[2].trim()
          };
        }
        
        // אם אין בשני השדות, השתמש ב-title כתוכן ובברירת מחדל h2
        return { level: 2, content: block.title.trim() };
      }
      
      // אין פורמט מיוחד ואין שדה content, השתמש בשדה title כתוכן
      return { level: 2, content: block.title.trim() };
    }
    
    // אם אין שדה title אבל יש content
    if (block.content) {
      // בדוק אם יש פורמט מיוחד בשדה content
      const contentHeadingMatch = block.content.match(/^h([1-6]):\s*(.+)$/);
      if (contentHeadingMatch) {
        return {
          level: parseInt(contentHeadingMatch[1]),
          content: contentHeadingMatch[2].trim()
        };
      }
      
      // אין פורמט מיוחד, השתמש בשדה content כתוכן
      return { level: 2, content: block.content.trim() };
    }
    
    // אין שדה title ואין שדה content, השתמש בכותרת ריקה
    return { level: 2, content: '' };
  };

  switch (contentType) {
    case 'title':
    case 'כותרת':
      const titleInfo = extractTitleContent(block);
      
      // בחירת גודל הגופן והשוליים על פי רמת הכותרת
      let titleClassName = "font-bold text-neutral-800 ";
      let marginClassName = "mb-4 ";
      
      switch (titleInfo.level) {
        case 1:
          titleClassName += "text-3xl";
          marginClassName += "mt-0";
          break;
        case 2:
          titleClassName += "text-2xl";
          marginClassName += "mt-6";
          break;
        case 3:
          titleClassName += "text-xl";
          marginClassName += "mt-5";
          break;
        default:
          titleClassName += "text-lg";
          marginClassName += "mt-4";
      }
      
      // יצירת אלמנט הכותרת המתאים לרמה
      const HeadingTag = `h${titleInfo.level}` as keyof JSX.IntrinsicElements;
      
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <HeadingTag className={`${titleClassName} ${marginClassName}`}>
              {titleInfo.content}
            </HeadingTag>
          </CardContent>
        </Card>
      );

    case 'text':
    case 'טקסט':
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </CardContent>
        </Card>
      );

    case 'image':
    case 'תמונה':
      // Use the helper function to handle Unsplash URLs
      const imageUrl = getUnsplashImageUrl(block.content);
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
                <img 
                  src={imageUrl} 
                  alt={block.description || ''} 
                  className="object-cover w-full h-full" 
                />
              </div>
              {block.description && (
                <p className="text-neutral-500 text-sm">{block.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'youtube':
    case 'יוטיוב':
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(block.content)}`}
                  title={block.title || "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              {block.description && (
                <p className="text-neutral-500 text-sm">{block.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'link':
    case 'קישור':
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <div className="flex">
                <a 
                  href={block.content} 
                  className="text-primary hover:underline flex items-center"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="material-icons text-sm mr-1">link</span>
                  {block.description || 'לחץ כאן לפתיחת הקישור'}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'list':
    case 'רשימה':
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <ul className="list-disc list-inside space-y-2">
                {block.content.split('\n').map((item, index) => (
                  <li key={index}>{item.trim()}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      );

    case 'table':
    case 'טבלה':
      // Parse table content
      // Assuming the content is in CSV or similar format
      const rows = block.content.split('\n').map(row => row.split(','));
      
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-50">
                      {rows[0].map((cell, index) => (
                        <th 
                          key={index} 
                          className="px-4 py-2 text-right font-medium text-neutral-800 border border-neutral-200"
                        >
                          {cell.trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-neutral-50' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex} 
                            className="px-4 py-2 border border-neutral-200"
                          >
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'separator':
    case 'מפריד':
      return (
        <div className="p-2">
          <Separator className="border-neutral-200" />
        </div>
      );

    case 'file':
    case 'קובץ':
      return (
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium text-neutral-800">{block.title}</h3>
              )}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons text-neutral-400 mr-3">description</span>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-800">
                      {getFileName(block.content)}
                    </p>
                    <p className="text-sm text-neutral-500">{block.description}</p>
                  </div>
                  <a 
                    href={block.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-neutral-50"
                    download
                  >
                    <span className="material-icons text-primary">download</span>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
};

// Helper function to extract YouTube ID from URL
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}

// Helper function to extract filename from URL
function getFileName(url: string) {
  try {
    return url.substring(url.lastIndexOf('/') + 1);
  } catch (error) {
    return url;
  }
}

// Helper function to convert Unsplash URL to direct image URL
function getUnsplashImageUrl(url: string) {
  // Check if it's an Unsplash URL but not already a direct image URL
  if (url.includes('unsplash.com/photos/') && !url.includes('images.unsplash.com')) {
    // Extract the photo ID
    const photoId = url.split('/photos/')[1].split(/[?#]/)[0];
    // Return the direct image URL with optimized parameters
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
  }
  return url; // Return original URL if not an Unsplash URL or already a direct URL
}

export default ContentBlock;
