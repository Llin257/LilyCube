

         /*================= Mouse events ======================*/

         var AMORTIZATION = 0.95;
         var drag = false;
         var old_x, old_y;
         var dX = 0, dY = 0;
         
         var mouseDown = function(e) {
            drag = true;
            old_x = e.pageX, old_y = e.pageY;
            e.preventDefault();
            return false;
         };
         
         var mouseUp = function(e){
            drag = false;
         };
         
         var mouseMove = function(e) {
            if (!drag) return false;
            dX = (e.pageX-old_x)*2*Math.PI/canvas.width,
            dY = (e.pageY-old_y)*2*Math.PI/canvas.height;
            THETA+= dX;
            PHI+=dY;
            old_x = e.pageX, old_y = e.pageY;
            e.preventDefault();
         };
         
         canvas.addEventListener("mousedown", mouseDown, false);
         canvas.addEventListener("mouseup", mouseUp, false);
         canvas.addEventListener("mouseout", mouseUp, false);
         canvas.addEventListener("mousemove", mouseMove, false);
         console.log(drag);

         /*=========================rotation================*/

         function rotateX(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv1 = m[1], mv5 = m[5], mv9 = m[9];
            
            m[1] = m[1]*c-m[2]*s;
            m[5] = m[5]*c-m[6]*s;
            m[9] = m[9]*c-m[10]*s;

            m[2] = m[2]*c+mv1*s;
            m[6] = m[6]*c+mv5*s;
            m[10] = m[10]*c+mv9*s;
         }

         function rotateY(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv0 = m[0], mv4 = m[4], mv8 = m[8];
            
            m[0] = c*m[0]+s*m[2];
            m[4] = c*m[4]+s*m[6];
            m[8] = c*m[8]+s*m[10];

            m[2] = c*m[2]-s*mv0;
            m[6] = c*m[6]-s*mv4;
            m[10] = c*m[10]-s*mv8;
         }

         /*=================== Drawing =================== */

         var THETA = 0,
         PHI = 0;
         var time_old = 0;
            
         var animate = function(time) {
            var dt = time-time_old;
               
            if (!drag) {
               dX *= AMORTIZATION, dY*=AMORTIZATION;
               THETA+=dX, PHI+=dY;
            }
               
            //set model matrix to I4
               
            mo_matrix[0] = 1, mo_matrix[1] = 0, mo_matrix[2] = 0,
            mo_matrix[3] = 0,
               
            mo_matrix[4] = 0, mo_matrix[5] = 1, mo_matrix[6] = 0,
            mo_matrix[7] = 0,
               
            mo_matrix[8] = 0, mo_matrix[9] = 0, mo_matrix[10] = 1,
            mo_matrix[11] = 0,
               
            mo_matrix[12] = 0, mo_matrix[13] = 0, mo_matrix[14] = 0,
            mo_matrix[15] = 1;

            rotateY(mo_matrix, THETA);
            rotateX(mo_matrix, PHI);
               
            time_old = time; 
            gl.enable(gl.DEPTH_TEST);
               
            // gl.depthFunc(gl.LEQUAL);
               
            gl.clearColor(0.5, 0.5, 0.5, 0.9);
            gl.clearDepth(1.0);
            gl.viewport(0.0, 0.0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix);
            gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
            gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
               
            window.requestAnimationFrame(animate);
         }
         
         animate(0);