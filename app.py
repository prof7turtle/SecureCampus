from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from PIL import Image
import io
import time

app = Flask(__name__)
CORS(app)

# Get the absolute path to the Face directory
FACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Face'))
DATASET_PATH = os.path.join(FACE_DIR, 'dataset')
TRAINER_PATH = os.path.join(FACE_DIR, 'trainer')

print(f"Face directory: {FACE_DIR}")
print(f"Dataset path: {DATASET_PATH}")
print(f"Trainer path: {TRAINER_PATH}")

# Load the face recognition model
model = cv2.face.LBPHFaceRecognizer_create()
model_path = os.path.join(TRAINER_PATH, 'trainer.yml')

if os.path.exists(model_path):
    model.read(model_path)
    print("Face recognition model loaded successfully from:", model_path)
else:
    print("Warning: Face recognition model not found at", model_path)

# Load the face cascade classifier
face_cascade_path = os.path.join(FACE_DIR, 'haarcascade_frontalface_default.xml')
if os.path.exists(face_cascade_path):
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    print("Face cascade classifier loaded successfully from:", face_cascade_path)
else:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("Using default face cascade classifier")

def base64_to_image(base64_string):
    # Remove the data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64 string to bytes
    img_data = base64.b64decode(base64_string)
    
    # Convert bytes to numpy array
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def recognize_face(image):
    try:
        start_time = time.time()
        timeout = 3  # 3 seconds timeout
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization for better contrast
        gray = cv2.equalizeHist(gray)
        
        # Detect faces with adjusted parameters for better detection
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        print(f"Number of faces detected: {len(faces)}")
        
        if len(faces) == 0:
            return [{
                'success': False,
                'face_detected': False,
                'message': 'No face detected in the image'
            }]
        
        results = []
        for (x, y, w, h) in faces:
            # Check for timeout
            if time.time() - start_time > timeout:
                return [{
                    'success': False,
                    'face_detected': True,
                    'message': 'Recognition timeout'
                }]
            
            # Extract face ROI
            face = gray[y:y+h, x:x+w]
            
            # Resize face to match training data size
            face = cv2.resize(face, (100, 100))
            
            # Recognize face
            label, distance = model.predict(face)
            
            # LBPH distance is lower = better
            # Convert distance to confidence percentage
            # Normalize distance to a 0-100 scale
            max_distance = 100  # Maximum expected distance
            confidence = max(0, min(100, (1 - (distance / max_distance)) * 100))
            
            print(f"Raw distance: {distance}, Label: {label}, Confidence: {confidence}%")
            
            # Adjust threshold for verification
            if confidence >= 10:  # Lower threshold to 10% for testing
                results.append({
                    'success': True,
                    'user_id': str(label),
                    'confidence': float(confidence) / 100.0,
                    'face_detected': True,
                    'message': 'Face verified successfully'
                })
            else:
                results.append({
                    'success': False,
                    'confidence': float(confidence) / 100.0,
                    'face_detected': True,
                    'message': 'Face detected but not verified'
                })
        
        if not results:
            return [{
                'success': False,
                'face_detected': False,
                'message': 'No face detected in the image'
            }]
        
        return results
    except Exception as e:
        print(f"Error in recognize_face: {str(e)}")
        return [{
            'success': False,
            'face_detected': False,
            'message': f'Error: {str(e)}'
        }]

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/homepage.html')
def serve_homepage():
    return send_from_directory('.', 'homepage.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 image to numpy array
        image = base64_to_image(data['image'])
        
        # Recognize face
        results = recognize_face(image)
        
        # Return the first result (assuming single face detection)
        return jsonify(results[0])
        
    except Exception as e:
        print(f"Error in /recognize endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 