import React from 'react';
import { ContentBlock as ContentBlockType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

interface ContentBlockProps {
  block: ContentBlockType;
  useContentSpacing?: boolean;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ block, useContentSpacing = false }) => {
  const { getSetting } = useGoogleSheets();
  
  // Get styling settings from Google Sheets
  const contentSpacing = getSetting('contentSpacing') || '24px';
  const pageBackground = getSetting('pageBackground') || '#f8f8fb';
  const headingColor = getSetting('headingColor') || '#333333';
  const cardBackground = getSetting('cardBackground') || '#ffffff';
  const cardBorderRadius = getSetting('cardBorderRadius') || '8px';
  const cardPadding = getSetting('cardPadding') || '24px';
  const cardMargin = getSetting('cardMargin') || '24px';
  const boxBackground = getSetting('boxBackground') || 'rgba(248, 248, 251, 0.7)';
  const questionColor = getSetting('questionColor') || '#7e3f98';
  const cardStyleSetting = getSetting('cardStyle') || 'default';
  const contentLineHeight = getSetting('contentLineHeight') || '1.6';
  
  // Define card style based on settings
  const getCardStyle = () => {
    // אם אנחנו צריכים להשתמש בהגדרת ריווח התוכן, נשתמש בו במקום גישה המרווח הקבוע
    const marginValue = useContentSpacing 
      ? (contentSpacing === '0' ? '0' : `0`)
      : (cardMargin === '0' ? '0' : `${cardMargin} 0`);
      
    return {
      backgroundColor: cardBackground,
      borderRadius: cardBorderRadius,
      margin: marginValue,
      boxShadow: cardStyleSetting === 'soft' ? '0 2px 8px rgba(0,0,0,0.05)' : 
                cardStyleSetting === 'modern' ? '0 4px 12px rgba(0,0,0,0.08)' : 
                'none'
    };
  };

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

  // פונקציה לקבלת רמת הכותרת והתוכן בפורמט החדש
  const extractTitleContent = (block: ContentBlockType) => {
    // קבל את רמת הכותרת מהשדה החדש heading_level (עמודה H)
    let headingLevel = 2; // ברירת מחדל היא h2
    
    if (block.heading_level) {
      // אם הערך הוא "h1", "h2", וכו'
      const levelMatch = block.heading_level.match(/^h([1-6])$/i);
      if (levelMatch) {
        headingLevel = parseInt(levelMatch[1]);
      } 
      // אם הערך הוא מספר בלבד - "1", "2", וכו'
      else if (/^[1-6]$/.test(block.heading_level)) {
        headingLevel = parseInt(block.heading_level);
      }
    }
    
    // בדיקת פורמט ישן שעדיין יכול להופיע בשדה title או content
    let titleContent = '';
    
    // 1. נסה לחלץ מ-title, הפורמט הישן "h2: כותרת"
    if (block.title) {
      const headingMatch = block.title.match(/^h([1-6]):\s*(.+)$/);
      if (headingMatch) {
        // אם מצאנו פורמט ישן, עדכן גם את רמת הכותרת וגם את התוכן
        headingLevel = parseInt(headingMatch[1]);
        titleContent = headingMatch[2].trim();
      } else {
        // אחרת, השתמש בשדה title כפי שהוא
        titleContent = block.title.trim();
      }
    }
    // 2. אם אין title אבל יש content, נסה לחלץ מ-content
    else if (block.content) {
      const contentHeadingMatch = block.content.match(/^h([1-6]):\s*(.+)$/);
      if (contentHeadingMatch) {
        headingLevel = parseInt(contentHeadingMatch[1]);
        titleContent = contentHeadingMatch[2].trim();
      } else {
        titleContent = block.content.trim();
      }
    }
    
    return {
      level: headingLevel,
      content: titleContent
    };
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
      
      // Apply custom styling from settings
      const titleCardStyle = getCardStyle();
      
      const headingStyle = {
        color: headingColor,
        lineHeight: contentLineHeight
      };
      
      return (
        <Card className="w-full" style={titleCardStyle}>
          <CardContent className="p-6" style={{ padding: cardPadding }}>
            <HeadingTag 
              className={`${titleClassName} ${marginClassName}`}
              style={headingStyle}
            >
              {titleInfo.content}
            </HeadingTag>
          </CardContent>
        </Card>
      );

    case 'text':
    case 'טקסט':
      // Apply custom styling from settings
      const textCardStyle = getCardStyle();
      
      const textContentStyle = {
        lineHeight: contentLineHeight
      };
      
      // Determine if this should be styled as a special box based on description
      let boxClassName = "";
      if (block.description === 'question-highlight') {
        boxClassName = "bg-purple-50 border border-purple-100";
      } else if (block.description === 'content-box') {
        boxClassName = "bg-white shadow-sm";
      } else if (block.description === 'highlight-box') {
        boxClassName = `bg-opacity-5 border border-opacity-10 rounded-lg p-4 border-[${questionColor}] bg-[${questionColor}]`;
      }
      
      return (
        <Card className="w-full" style={textCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div 
              className={`prose max-w-none ${boxClassName}`}
              style={textContentStyle}
              dangerouslySetInnerHTML={{ 
                __html: block.content 
              }}
            />
          </CardContent>
        </Card>
      );

    case 'image':
    case 'תמונה':
      // Use the helper function to handle Unsplash URLs
      const imageUrl = getUnsplashImageUrl(block.content);
      const imageCardStyle = getCardStyle();
      
      return (
        <Card className="w-full" style={imageCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
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
      const youtubeCardStyle = getCardStyle();
      
      return (
        <Card className="w-full" style={youtubeCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
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
      const linkCardStyle = getCardStyle();
      
      return (
        <Card className="w-full" style={linkCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
              )}
              <div className="flex">
                <a 
                  href={block.content} 
                  className="hover:underline flex items-center"
                  style={{ color: questionColor }}
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
      const listCardStyle = getCardStyle();
      const listContentStyle = { lineHeight: contentLineHeight };
      
      return (
        <Card className="w-full" style={listCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
              )}
              <ul className="list-disc list-inside space-y-2" style={listContentStyle}>
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
      const tableCardStyle = getCardStyle();
      
      return (
        <Card className="w-full" style={tableCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ lineHeight: contentLineHeight }}>
                  <thead>
                    <tr className="bg-neutral-50">
                      {rows[0].map((cell, index) => (
                        <th 
                          key={index} 
                          className="px-4 py-2 text-right font-medium border border-neutral-200"
                          style={{ color: headingColor }}
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
      const fileCardStyle = getCardStyle();
      
      return (
        <Card className="w-full" style={fileCardStyle}>
          <CardContent style={{ padding: cardPadding }}>
            <div className="space-y-4">
              {block.title && (
                <h3 className="text-xl font-medium" style={{ color: headingColor }}>{block.title}</h3>
              )}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons text-neutral-400 mr-3">description</span>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: headingColor }}>
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
                    <span className="material-icons" style={{ color: questionColor }}>download</span>
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
