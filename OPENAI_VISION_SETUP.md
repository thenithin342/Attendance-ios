# OpenAI Vision API Integration Guide for IIITDM AttendanceSync PWA

## Overview
This guide will help you integrate OpenAI Vision API for secure facial recognition and liveness detection in your IIITDM AttendanceSync PWA.

## Step 1: OpenAI Account Setup

1. **Create OpenAI Account**
   - Visit: https://platform.openai.com/
   - Sign up or log in
   - Complete account verification

2. **Get API Key**
   - Navigate to "API Keys" section
   - Click "Create new secret key"
   - Name: `IIITDM AttendanceSync Vision`
   - Copy the API key (starts with `sk-`)

## Step 2: Environment Configuration

Add to your `/app/backend/.env` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini  # Cost-effective model with vision capabilities
```

## Step 3: Install Dependencies

### Backend Dependencies
```bash
cd /app/backend
pip install openai pillow opencv-python-headless
```

### Frontend Dependencies
```bash
cd /app/frontend
yarn add react-webcam
```

## Step 4: Backend Implementation

Create `/app/backend/vision_service.py`:

```python
import os
import base64
import json
from openai import OpenAI
from PIL import Image
import io
import cv2
import numpy as np

class VisionService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    
    async def verify_face_liveness(self, image_base64: str) -> dict:
        """
        Verify if the image contains a live person (not a photo of a photo)
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """
                                Analyze this image for liveness detection. Check if this is a real person vs a photo/screen/fake image.
                                
                                Look for:
                                1. Natural lighting and shadows
                                2. Real skin texture and depth
                                3. Natural eye reflections
                                4. No screen pixels or photo artifacts
                                5. Proper face positioning and angle
                                
                                Return JSON with:
                                - is_live: boolean
                                - confidence: number (0-1)
                                - face_detected: boolean
                                - reasons: array of strings
                                """
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            return {
                "is_live": False,
                "confidence": 0.0,
                "face_detected": False,
                "reasons": [f"Error: {str(e)}"]
            }
    
    async def extract_face_features(self, image_base64: str) -> dict:
        """
        Extract facial features for attendance verification
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """
                                Analyze this face image for attendance verification.
                                
                                Extract:
                                1. Face quality (lighting, clarity, angle)
                                2. Estimated age range
                                3. Facial landmarks visible
                                4. Image quality score
                                5. Suitable for attendance verification
                                
                                Return JSON with:
                                - face_quality: number (0-1)
                                - age_range: string
                                - suitable_for_attendance: boolean
                                - quality_issues: array of strings
                                - verification_score: number (0-1)
                                """
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            return {
                "face_quality": 0.0,
                "age_range": "unknown",
                "suitable_for_attendance": False,
                "quality_issues": [f"Error: {str(e)}"],
                "verification_score": 0.0
            }
    
    def preprocess_image(self, image_base64: str) -> str:
        """
        Preprocess image for better recognition
        """
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (max 1024x1024 for API efficiency)
            max_size = 1024
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Convert back to base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            return base64.b64encode(buffered.getvalue()).decode()
            
        except Exception as e:
            return image_base64  # Return original if preprocessing fails
```

## Step 5: API Endpoints

Add to `/app/backend/server.py`:

```python
from vision_service import VisionService
from pydantic import BaseModel
import logging

# Initialize Vision Service
vision_service = VisionService()

class FaceVerificationRequest(BaseModel):
    image_base64: str
    user_id: str

class BiometricRegistrationRequest(BaseModel):
    image_base64: str
    user_id: str

@api_router.post("/api/verify-face")
async def verify_face(request: FaceVerificationRequest):
    """
    Verify face liveness and extract features for attendance
    """
    try:
        # Preprocess image
        processed_image = vision_service.preprocess_image(request.image_base64)
        
        # Check liveness
        liveness_result = await vision_service.verify_face_liveness(processed_image)
        
        if not liveness_result["is_live"]:
            return {
                "success": False,
                "message": "Liveness check failed",
                "details": liveness_result
            }
        
        # Extract features
        features_result = await vision_service.extract_face_features(processed_image)
        
        if not features_result["suitable_for_attendance"]:
            return {
                "success": False,
                "message": "Image not suitable for attendance",
                "details": features_result
            }
        
        # Store attendance record
        attendance_record = {
            "user_id": request.user_id,
            "timestamp": datetime.utcnow(),
            "verification_score": features_result["verification_score"],
            "liveness_confidence": liveness_result["confidence"],
            "attendance_type": "face_verification"
        }
        
        await db.attendance_records.insert_one(attendance_record)
        
        return {
            "success": True,
            "message": "Face verified successfully",
            "attendance_marked": True,
            "details": {
                "liveness": liveness_result,
                "features": features_result,
                "timestamp": attendance_record["timestamp"]
            }
        }
        
    except Exception as e:
        logging.error(f"Face verification error: {e}")
        return {
            "success": False,
            "message": "Face verification failed",
            "error": str(e)
        }

@api_router.post("/api/register-biometric")
async def register_biometric(request: BiometricRegistrationRequest):
    """
    Register biometric data for a user
    """
    try:
        # Preprocess image
        processed_image = vision_service.preprocess_image(request.image_base64)
        
        # Check liveness
        liveness_result = await vision_service.verify_face_liveness(processed_image)
        
        if not liveness_result["is_live"]:
            return {
                "success": False,
                "message": "Liveness check failed during registration",
                "details": liveness_result
            }
        
        # Extract features
        features_result = await vision_service.extract_face_features(processed_image)
        
        # Store biometric template
        biometric_record = {
            "user_id": request.user_id,
            "registered_at": datetime.utcnow(),
            "face_features": features_result,
            "liveness_baseline": liveness_result["confidence"],
            "image_hash": hashlib.sha256(processed_image.encode()).hexdigest()
        }
        
        await db.biometric_templates.insert_one(biometric_record)
        
        return {
            "success": True,
            "message": "Biometric registered successfully",
            "details": {
                "registration_id": str(biometric_record["_id"]),
                "timestamp": biometric_record["registered_at"]
            }
        }
        
    except Exception as e:
        logging.error(f"Biometric registration error: {e}")
        return {
            "success": False,
            "message": "Biometric registration failed",
            "error": str(e)
        }
```

## Step 6: Frontend Camera Component

Create `/app/frontend/src/components/CameraCapture.js`:

```javascript
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const CameraCapture = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setIsLoading(true);
      setError('');
      
      try {
        // Convert to base64 without data URL prefix
        const base64Image = imageSrc.split(',')[1];
        await onCapture(base64Image);
      } catch (err) {
        setError('Failed to process image');
      } finally {
        setIsLoading(false);
      }
    }
  }, [onCapture]);

  const videoConstraints = {
    width: 720,
    height: 540,
    facingMode: "user"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Face Verification
          </h3>
          <p className="text-gray-600 text-sm">
            Look directly at the camera and ensure good lighting
          </p>
        </div>
        
        <div className="camera-view mb-4">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full rounded-lg"
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={capture}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Capture & Verify'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
```

## Step 7: Integration with Home Component

Update the `handleMarkAttendance` function in `/app/frontend/src/components/Home.js`:

```javascript
const handleMarkAttendance = async () => {
  setShowCamera(true);
};

const handleCameraCapture = async (base64Image) => {
  try {
    const response = await fetch(`${API}/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: base64Image,
        user_id: getUserId()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setAttendanceStatus('Marked Successfully');
      setFaceVerified(true);
    } else {
      setAttendanceStatus('Verification Failed');
      setError(result.message);
    }
  } catch (error) {
    setAttendanceStatus('Error - Try Again');
    setError('Network error occurred');
  }
  
  setShowCamera(false);
};
```

## Step 8: Security Considerations

1. **Image Processing**
   - Limit image size to prevent abuse
   - Validate image format and content
   - Implement rate limiting

2. **Data Privacy**
   - Store minimal biometric data
   - Encrypt sensitive information
   - Implement data retention policies

3. **API Security**
   - Use HTTPS for all communications
   - Implement proper authentication
   - Monitor API usage and costs

## Step 9: Testing

1. **Liveness Detection**
   - Test with real face vs photo
   - Test with different lighting conditions
   - Test with masks, glasses, etc.

2. **Face Quality**
   - Test with blurry images
   - Test with different angles
   - Test with multiple faces

3. **Performance**
   - Test API response times
   - Monitor OpenAI API costs
   - Test offline scenarios

## Step 10: Production Deployment

1. **Environment Variables**
   - Secure API key storage
   - Use different keys for dev/prod
   - Implement key rotation

2. **Monitoring**
   - Set up API usage alerts
   - Monitor error rates
   - Track attendance accuracy

3. **Backup System**
   - Implement fallback authentication
   - Store attendance records redundantly
   - Plan for API outages

## Cost Optimization

1. **Image Preprocessing**
   - Resize images before sending to API
   - Compress images appropriately
   - Cache results when possible

2. **Model Selection**
   - Use `gpt-4o-mini` for cost efficiency
   - Consider upgrading to `gpt-4o` for better accuracy
   - Monitor usage and optimize

3. **Request Optimization**
   - Batch requests when possible
   - Implement smart retries
   - Use appropriate timeouts

---

**Ready to implement?** 
Once you have the OpenAI API key, we can integrate the facial recognition system and test the complete attendance marking flow!