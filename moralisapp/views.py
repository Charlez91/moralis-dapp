from flask import render_template, redirect
from moralisapp import app

@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html')