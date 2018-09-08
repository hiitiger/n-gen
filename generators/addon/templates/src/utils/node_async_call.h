
#pragma once

#include <string>
#include <memory>
#include <mutex>
#include <atomic>
#include <functional>
#include <iostream>
#include <queue>

#include <uv.h>

template <typename Elem, typename Lck = std::mutex>
class uv_async_queue
{
    uv_async_queue(const uv_async_queue &) = delete;
    uv_async_queue &operator=(const uv_async_queue &) = delete;

  public:
    using callback_type = std::function<void(std::function<void()> &)>;

    uv_async_queue(uv_loop_t *loop, callback_type &&cb)
        : async_handle_((uv_async_t *)malloc(sizeof(uv_async_t))), closed_(false), callback_(std::move(cb)), capacity_(0)
    {
        uv_async_init(loop, async_handle_, async_callback);
        async_handle_->data = this;
    }

    ~uv_async_queue()
    {
        uv_close((uv_handle_t *)async_handle_, [](uv_handle_t *handle) {
            free(handle);
        });
    }

    int post(Elem &&e)
    {
        if (closed_)
        {
            return -1;
        }

        {
            std::lock_guard<Lck> guard(lock_);
            if (capacity_ && queue_.size() > capacity_)
            {
                queue_.pop();
            }
            queue_.push(std::move(e));
        }

        return !uv_async_send(async_handle_) ? 0 : -1;
    }

    size_t size() const
    {
        std::lock_guard<Lck> guard(lock_);
        return queue_.size();
    }

    bool empty() const
    {
        return size() == 0;
    }

    void close()
    {
        if (!empty())
        {
            std::cerr << " You should close this queue after taking all the elements!" << std::endl;
        }
        closed_ = true;
    }

    bool closed() const
    {
        return closed_;
    }

    void set_capacity(size_t capacity)
    {
        capacity_ = capacity;
    }

    void clear()
    {
        std::lock_guard<Lck> guard(lock_);
        std::queue<Elem> empty;
        std::swap(queue_, empty);
    }


  private:
    static void async_callback(uv_async_t *handle)
    {
        reinterpret_cast<uv_async_queue *>(handle->data)->on_event();
    }

    void on_event()
    {
        std::unique_lock<Lck> lock(lock_);
        while (!queue_.empty())
        {
            Elem e(std::move(queue_.front()));
            queue_.pop();
            lock.unlock();
            callback_(e);
            lock.lock();
        }
    }

  private:
    uv_async_t *async_handle_ = nullptr;
    std::atomic<bool> closed_ = false;
    mutable Lck lock_;
    std::queue<Elem> queue_;
    callback_type callback_;
    size_t capacity_ = 0;
};

class node_async_call
{
  public:
    static void async_call(std::function<void()> &&cb)
    {
        node_async_call::instance().node_queue_->post(std::move(cb));
    }

  private:
    using node_queue_type = uv_async_queue<std::function<void()>>;
    node_async_call()
    {
        node_queue_.reset(new uv_async_queue<std::function<void()>>(uv_default_loop(), std::bind(&node_async_call::run_task, this, std::placeholders::_1)));
    }
    ~node_async_call()
    {
    }

    void run_task(std::function<void()> &task)
    {
        task();
    }

    static node_async_call &instance() { return s_instance_; }

    std::unique_ptr<node_queue_type> node_queue_;
    static node_async_call s_instance_;
};
